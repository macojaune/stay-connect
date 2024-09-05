defmodule StayConnectWeb.AddReleaseLive do
  use StayConnectWeb, :live_view
  alias StayConnect.{Release, Artist, Category}
  alias StayConnectWeb.AutoCompleteComponent
  require Logger

  def mount(_params, _session, socket) do
    release_changeset = Release.changeset(%Release{})
    release_types = [Projet: "project", Single: "single", Clip: "video"]

    socket =
      socket
      |> assign(:page_title, "Ajouter une sortie")
      |> assign(:release_form, to_form(release_changeset))
      |> assign(:trigger_submit, false)
      |> assign(:release_types, release_types)
      |> assign(:urls, [""])
      |> assign(:search_artists, &search_artists(&1, socket.assigns.current_user.artist.id))
      |> assign(:search_categories, &search_categories/1)
      |> assign(:selected_categories, [])
      |> assign(:selected_featurings, [])

    {:ok, socket}
  end

  defp search_artists(query, current_artist_id) do
    Artist.search_by_name(query) |> Enum.reject(fn artist -> artist.id == current_artist_id end)
  end

  defp search_categories(query) do
    Category.search_by_name(query)
  end

  @doc """
  Handles the selection of items in the autocomplete components.

  This function is called when an item is selected from either the category or featuring artist
  autocomplete components. It updates the socket's state with the newly selected item.

  ## Parameters

  - `:selected_item` - The atom indicating that an item was selected.
  - `"search-category-input"` or `"search-featuring-input"` - The ID of the autocomplete component.
  - `category` or `artist` - The selected category or artist.
  - `socket` - The current socket.

  ## Returns

  A tuple `{:noreply, updated_socket}` where `updated_socket` has the newly selected item added
  to either the `:selected_categories` or `:selected_featuring` list.

  """
  def handle_info({:selected_item, "search-category-input", category}, socket) do
    {:noreply, update(socket, :selected_categories, &[category | &1])}
  end

  def handle_info({:selected_item, "search-artist-input", artist}, socket) do
    {:noreply, update(socket, :selected_featurings, &[artist | &1])}
  end

  def handle_event("add_url", _params, socket) do
    urls = socket.assigns.urls ++ [""]
    {:noreply, assign(socket, urls: urls)}
  end

  def handle_event("remove_url", %{"index" => index}, socket) do
    index = String.to_integer(index)
    urls = List.delete_at(socket.assigns.urls, index)
    urls = if urls == [], do: [""], else: urls
    {:noreply, assign(socket, urls: urls)}
  end

  def handle_event("update_url", %{"index" => index, "value" => value}, socket) do
    index = String.to_integer(index)
    urls = List.replace_at(socket.assigns.urls, index, value)
    {:noreply, assign(socket, urls: urls)}
  end

  def handle_event("validate_release", %{"release" => release_params}, socket) do
    IO.inspect(release_params, label: "Validate event params")

    urls = socket.assigns.urls |> Enum.reject(&(&1 == ""))
    release_params = Map.put(release_params, "urls", urls)

    changeset =
      %StayConnect.Release{}
      |> StayConnect.Release.changeset(release_params)
      |> Map.put(:action, :validate)

    {:noreply, assign(socket, form: to_form(changeset))}
  end

  def handle_event("add_release", %{"release" => release}, socket) do
    urls = socket.assigns.urls |> Enum.reject(&(&1 == ""))

    release_params =
      Map.put(release, "urls", urls)
      |> Map.put("categories", socket.assigns.selected_categories)
      |> Map.put("featurings", socket.assigns.selected_featurings)
      |> Map.put("artist_id", socket.assigns.current_user.artist.id)

    case Release.create(release_params) do
      {:ok, release} ->
        IO.inspect(release, label: "Release created")

        {
          :noreply,
          socket
          |> assign(:trigger_submit, true)
          |> put_flash(:info, "Release created successfully")
          #  |> push_navigate(to: ~p"/sorties/#{release.id}")
        }

      {:error, changeset} ->
        IO.inspect(changeset, label: "Error")
        {:noreply, socket |> assign(:release_form, to_form(changeset))}
    end
  end
end
