defmodule StayConnectWeb.ReleaseDetailsLive do
  use StayConnectWeb, :live_view
  alias StayConnect.{Release}

  def mount(params, _session, socket) do
    release = Release.by_id!(params["release_id"])
    socket = socket |> assign(:release, release)
    {:ok, socket}
  end

  def get_featurings(release) do
    Enum.map(release.featuring, fn feat ->
      feat.name
    end)
    |> Enum.join(", ")
  end

  def render(assigns) do
    ~H"""
    <div>
    <.back navigate={~p"/"}>Retour</.back>
      <span class="text-sm"><%= @release.type %></span>
      <.header>
        <%= @release.artist.name %>
        <%= if @release.featuring, do: "ft. " <> get_featurings(@release), else: "" %> - <%= @release.title %>
        <:actions>
        <%= for cat <- @release.categories do %>
          <a class="text-slate-300 text-sm"><%= cat.title %></a>
        <% end %>
        </:actions>
      </.header>
      <p class="text-justify my-5"><%= @release.description %></p>
      <%!-- Votes --%>
    <%!-- Links --%>
      <%!-- TODO: Avis --%>
    </div>
    """
  end
end
