defmodule StayConnectWeb.AutoCompleteComponent do
  alias StayConnect.Artist

  use StayConnectWeb, :live_component
  require Logger

  attr :show, :boolean, default: false
  attr :on_cancel, JS, default: %JS{}

  @impl true
  def render(assigns) do
    ~H"""
    <div class="relative">
      <.label><%= @label %></.label>
      <.search_input
        phx-keyup="do-search"
        phx-target={@myself}
        phx-debounce="200"
        placeholder={@placeholder}
        value={@query}
      />
      <.search_modal id="featurings-modal" show={@show} on_cancel={JS.push("cancel", target: @myself)}>
        <.results artists={@artists} />
      </.search_modal>
      <div class="flex flex-row gap-4 mt-3" id="selected-artists">
        <span :for={artist <- @selected} id={"selected-artist-#{artist.id}"} class="border px-3 py-2 rounded-md">
          <%= artist.name %>
          <button id={"remove-artist-#{artist.id}"} phx-click="remove-artist" phx-target={@myself} phx-value-id={artist.id}>
            <.icon name="hero-x-mark-solid" class="w-4 h-4" />
          </button>
        </span>
      </div>
    </div>
    """
  end

  attr :value, :any
  attr :placeholder, :string, default: "Rechercher un artiste"
  attr :rest, :global

  def search_input(assigns) do
    ~H"""
    <input
      {@rest}
      type="text"
      class="mt-2 block w-full rounded-lg text-zinc-900 focus:ring-0 sm:text-sm sm:leading-6 border-zinc-300 focus:border-zinc-400"
      placeholder={@placeholder}
      role="combobox"
      aria-expanded="false"
      aria-controls="options"
      autocomplete="off"
    />
    """
  end

  attr :artists, :list, required: true

  def results(assigns) do
    ~H"""
    <ul class="-mb-2 py-2 text-sm text-gray-800 flex space-y-2 flex-col" id="options" role="listbox">
      <li
        :if={@artists == []}
        id="option-none"
        role="option"
        tabindex="-1"
        class="cursor-default select-none rounded-md px-4 py-2 text-xl"
      >
        No Results
      </li>

      <button :for={artist <- @artists} id={"artist-#{artist.id}"}>
        <.result_item artist={artist} />
      </button>
    </ul>
    """
  end

  attr :artist, Artist, required: true

  def result_item(assigns) do
    ~H"""
    <li
      class="cursor-default select-none rounded-md px-4 py-2 text-xl bg-zinc-100 hover:bg-zinc-800 hover:text-white hover:cursor-pointer flex flex-row space-x-2 items-center"
      id={"option-#{@artist.id}"}
      role="option"
      tabindex="-1"
      phx-click="select-artist"
      phx-target="#selected-artists"
      phx-value-id={@artist.id}
    >
      <div>
        <%!-- todo image --%>
        <%= @artist.name %>
      </div>
    </li>
    """
  end

  attr :id, :string, required: true
  attr :show, :boolean, default: false
  attr :on_cancel, JS, default: %JS{}
  slot :inner_block, required: true

  def search_modal(assigns) do
    ~H"""
    <div id={@id} class={["flex min-h-full justify-center", @show || "hidden"]}>
      <div class="w-full min-h-12 p-2 sm:p-4 lg:pb-6 lg:pt-0">
        <.focus_wrap
          id={"#{@id}-container"}
          class="relative rounded-b-2xl bg-white p-2 shadow-lg shadow-zinc-700/10 ring-1 ring-zinc-700/10 transition min-h-[30vh] max-h-[50vh] overflow-y-scroll"
        >
          <div id={"#{@id}-content"}>
            <%= render_slot(@inner_block) %>
          </div>
        </.focus_wrap>
      </div>
    </div>
    """
  end

  defp search_artists(query, default) when is_binary(query) do
    try do
      Artist.searchByName(query)
    rescue
      Exqlite.Error ->
        default
    end
  end

  defp search_artists(_, default), do: default

  @impl true
  def mount(socket) do
    socket =
      socket
      |> assign(:show, false)
      |> assign(:query, "")
      |> assign(:selected, [])

    {:ok, socket}
  end

  @impl true
  def update(assigns, socket) do
    {:ok,
     socket
     |> assign(assigns)
     |> assign(:artists, [])
     |> assign(:query, "")}
  end

  @impl true
  def handle_event("do-search", %{"value" => value}, socket) do
    artists = search_artists(value, socket.assigns.artists)
    show = length(artists) > 0
    Logger.info("Search query: #{value}, Artists found: #{length(artists)}, Show modal: #{show}")

    {:noreply,
     socket
     |> assign(:query, value)
     |> assign(:artists, artists)
     |> assign(:show, show)}
  end

  @impl true
  def handle_event("select-artist", %{"id" => artist_id}, socket) do
    artist = find_or_fetch_artist(artist_id, socket.assigns.artists)

    socket =
      if artist do
        socket
        |> update(:selected, &(&1 ++ [artist]))
        |> assign(query: "", show: false, artists: [])
      else
        socket
      end

    {:noreply, socket}
  end
 @impl true
  def handle_event("remove-artist", %{"id" => artist_id}, socket) do
    updated_selected =
      Enum.reject(socket.assigns.selected, fn artist -> artist.id == String.to_integer(artist_id) end)
    {:noreply, assign(socket, :selected, updated_selected)}
  end
  defp find_or_fetch_artist(artist_id, artists) do
    case Enum.find(artists, &(&1.id == artist_id)) do
      # Assuming you have an Artist.get/1 function
      nil -> Artist.get(artist_id)
      artist -> artist
    end
  end



  def show_results(js \\ %JS{}, id) when is_binary(id) do
    js
    |> JS.show(to: "##{id}")
    |> JS.show(
      to: "##{id}",
      time: 300,
      transition: {"transition-all transform ease-out duration-300", "opacity-0", "opacity-100"}
    )
    |> show("##{id}-container")
    # |> JS.add_class("overflow-hidden", to: "body")
    |> JS.focus_first(to: "##{id}-content")
  end

  def hide_results(js \\ %JS{}, id) do
    js
    |> JS.hide(
      to: "##{id}-container",
      transition: {"transition-all transform ease-in duration-200", "opacity-100", "opacity-0"}
    )
    # |> hide("##{id}-container")
    |> JS.hide(to: "##{id}", transition: {"block", "block", "hidden"})
    # |> JS.remove_class("overflow-hidden", to: "body")
    |> JS.pop_focus()
  end
end
