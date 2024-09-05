defmodule StayConnectWeb.ReleaseListComponent do
  require Logger
  alias StayConnect.Vote
  use StayConnectWeb, :live_component

  attr :list_type, :string, default: "weekly"
  attr :items, :list

  def render(assigns) do
    ~H"""
    <div>
      <%= if length(@items) > 0 do %>
        <ul class="space-y-3">
          <%= for item <- @items do %>
            <li class="flex flex-row group hover:bg-brand/10 rounded-md px-4 py-2 justify-between transition-colors ease-linear gap-4">
              <div class="aspect-square h-full flex flex-col justify-center">
                <.button
                  type="button"
                  phx-click="upvote"
                  id={"upvote-#{item.id}"}
                  phx-value-id={item.id}
                  phx-value-list_type={@list_type}
                  class="bg-transparent border-transparent text-brand hover:bg-white hover:border-brand border"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    class="size-5 text-brand"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M9.47 6.47a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 1 1-1.06 1.06L10 8.06l-3.72 3.72a.75.75 0 0 1-1.06-1.06l4.25-4.25Z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </.button>
                <span class="text-center"><%= get_vote(item.id) %></span>
                <.button
                  phx-click="downvote"
                  id={"downvote-#{item.id}"}
                  phx-value-id={item.id}
                  phx-value-list_type={@list_type}
                  class="border-transparent bg-transparent text-zinc-900 hover:border-red-600 hover:text-red-600 hover:bg-transparent border"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    class="size-5"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </.button>
              </div>
              <div class="flex flex-col justify-between grow">
                <div class="flex flex-row gap-x-5 items-center">
                  <.link navigate={~p"/sorties/#{item.id}"}>
                    <p class="text-lg">
                      <strong class="font-semibold text-xl">
                        <%= item.artist.name %> − <%= item.title %>
                      </strong>
                      <%= if length(item.featurings)>0 do %>
                        ft.
                        <%= for feat <- item.featurings do %>
                          <a href=""><%= feat.name %></a>
                        <% end %>
                      <% end %>
                    </p>
                  </.link>
                  <div>
                    <span class="text-sm"><%= item.type %></span>
                  </div>
                </div>
                <div class="flex flex-row gap-x-3">
                  <%!-- <span class="text-slate-300 text-sm"><%= length(item.reviews) %> avis</span> --%>
                  <%= for cat <- item.categories do %>
                    <a class="text-slate-300 text-sm"><%= cat.name %></a>
                  <% end %>
                </div>
              </div>
              <img alt="cover" class="aspect-square h-full" />
            </li>
          <% end %>
        </ul>
      <% else %>
        <%= if @list_type == "daily" do %>
          <div class="text-center bg-brand/10 rounded-md p-4">
            Pas encore de sortie pour aujourd'hui
            <a
              class="text-white border border-brand rounded-md px-2 py-1 bg-brand hover:text-brand hover:bg-white transition-colors ease-linear"
              href="/ajouter-une-sortie"
            >
              Ajoute la tienne !
            </a>
          </div>
        <% end %>
      <% end %>
    </div>
    """
  end

  def get_vote(release_id) do
    Vote.get_release_score(release_id)
  end
end
